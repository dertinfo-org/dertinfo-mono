---
title: Website smoke
type: fixture
status: active
updated: 2026-10-11
id: web.fixture-1
summary: A visitor, an event administrator, and a group administrator walk the website from cookie consent through a submitted and confirmed registration.
state: run-config.yaml
baseState: ../../../shared-state/system-empty
eventData: ../../../shared-data/events/event1.json
groupData: ../../../shared-data/groups/group1.json
formData: ../../../shared-data
scenarios:
  - ../../tests/public.cookie-consent.visitor-accepts.mjs
  - ../../tests/event.eventadmin.createandconfigure-scenario1.mjs
  - ../../tests/group.groupadmin.createandconfigure-scenario1.mjs
  - ../../tests/registration.groupadmin.registerforevent-scenario1.mjs
  - ../../tests/registration.groupadmin.checkregistrationandedit-scenario1.mjs
  - ../../tests/public.content.visitor-browses.mjs
wider:
  - ../../tests/auth.session-continuity.rejected-cache-returns-to-sign-in.mjs
logins: ../../../shared-data/logins.env.example
---

# Website smoke

## Summary

The website smoke suite is one fixture. A full run sets the database to [system-empty](../../../shared-state/system-empty), then the scenarios type [event1](../../../shared-data/events/event1.json) and [group1](../../../shared-data/groups/group1.json) into the site: cookie consent, an event, a group, a registration, invoices, and the public pages.

## Synopsis

[run-config.yaml](run-config.yaml) is the checked-in sandbox: apply [system-empty](../../../shared-state/system-empty), type event1 and group1, record nothing, and clear [run-state](run-state) after a passing run. That pack is the database after startup, with no events or groups. The runner applies it in place. It does not drop SQL or restart the API. It then deletes `run-state/chain.json`. A failing run leaves the session files. `--base-state none --clear-session false` leaves the database and the chain so a later fixture can continue from them. `--event-data` and `--group-data` choose `event1`, `event2`, `group1`, or `group2`.

The names, dates, people, and teams the administrators type come from [shared form data](../../../shared-data). Passwords are `DERTINFO_E2E_EVENT_ADMIN_*` and `DERTINFO_E2E_GROUP_ADMIN_*` in [logins.env](../../../shared-data/logins.env.example).

The scenarios, in run order:

| Scenario | What it does |
|----------|----------------|
| [public.cookie-consent.visitor-accepts](../../tests/public.cookie-consent.visitor-accepts.mjs) | Accepts the cookie banner |
| [event.eventadmin.createandconfigure-scenario1](../../tests/event.eventadmin.createandconfigure-scenario1.mjs) | Creates and configures an event, then adds activities |
| [group.groupadmin.createandconfigure-scenario1](../../tests/group.groupadmin.createandconfigure-scenario1.mjs) | Creates and configures a group, then adds people, a team, and a gallery image |
| [registration.groupadmin.registerforevent-scenario1](../../tests/registration.groupadmin.registerforevent-scenario1.mjs) | Registers the group for the event and submits |
| [registration.groupadmin.checkregistrationandedit-scenario1](../../tests/registration.groupadmin.checkregistrationandedit-scenario1.mjs) | Amends, confirms, and reviews the invoices |
| [public.content.visitor-browses](../../tests/public.content.visitor-browses.mjs) | Opens the public pages |

[auth.session-continuity.rejected-cache-returns-to-sign-in](../../tests/auth.session-continuity.rejected-cache-returns-to-sign-in.mjs) stays available and is left out of the smoke command.

Each scenario keeps the flow and the recorded browser. Clicks and checks live on the page objects under [pages](../../pages). [run.mjs](run.mjs) is the entry point for this fixture. It loads the tests above from [tests](../../tests).

From `tests/e2e`:

```bash
npm run test:web:smoke
npm run test:web:smoke -- --video all
npm run test:web:smoke -- --video errors
```

The website must already be up at `http://localhost:44200`, with the API and image resize running. The browser is the smoke desktop size, 1400 by 900.
