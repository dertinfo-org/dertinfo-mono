---
name: Public content
type: feature
status: active
updated: 2026-09-27
id: public.content
roles: [public-user]
---

# Feature: Public content

## Description

Visitors can view public website content: limited competition results, links to associated bodies, and submitted dance notations for the traditional competition (where published).

## User roles

- **public-user** — browse public pages without signing in

## Behaviour

- After competitions are [results published](results-publish.md), see a **limited** results view: **aggregations** and award outcomes — **not** individual score sheets or full individual scores.
- Browse links to other **associated bodies**.
- View visibility of submitted **dance notations** for the **traditional** competition (as published).
- Other public/marketing pages as offered (home, history, community, and similar).
- Publish **terms and conditions**, cookie policy, and related legal pages used by [GDPR consent](account-gdpr-consent.md) and [Cookie consent](cookie-consent.md).
- Present [cookie consent](cookie-consent.md) on public browsing.

## Limitations

- Score sheets and detailed individual scores are not public.
- Own-team detailed scores/sheets (after publish) are for authorised group/team viewers in the app — see [Publish competition results](results-publish.md).
- Signed-in management features require authentication and the appropriate roles.

## Scenarios

```gherkin
Feature: Public content
  As a public user
  I want to browse the public pages
  So that I can see what the platform offers without signing in

  Scenario: Visitor browses public pages
    Given the visitor is not signed in
    When the visitor opens the public pages
    Then each public page shows its content
```

