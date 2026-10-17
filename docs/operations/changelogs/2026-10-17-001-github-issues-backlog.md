# Open work moved from the repo onto GitHub Issues

## Summary of the work completed

Still-open notes under `docs/operations/planned-fixes/` are open GitHub issues on `dertinfo/dertinfo-mono`. The folder is gone. Docs, changelogs, and Cursor rules now say new work is a GitHub issue, not a page under `docs/operations/`.

Hosting decisions that are already in force (no virtual network, the SKU choices, and what was rejected) are [Hosting and cost](../../technical/architecture/hosting-and-cost.md). That page is not an issue.

GitHub issue types (`task`, `bug`, `feature`) are not available on this user-owned repository. `gh issue create --type` reports no types. Issues are tagged with the default labels where one fits: `bug`, `enhancement`, or `documentation`.

Parents and children:

- [79](https://github.com/dertinfo/dertinfo-mono/issues/79) website product notes, with [80](https://github.com/dertinfo/dertinfo-mono/issues/80)–[95](https://github.com/dertinfo/dertinfo-mono/issues/95) and the email test [130](https://github.com/dertinfo/dertinfo-mono/issues/130)
- [96](https://github.com/dertinfo/dertinfo-mono/issues/96) deferred website Angular modernisation, with [97](https://github.com/dertinfo/dertinfo-mono/issues/97)–[109](https://github.com/dertinfo/dertinfo-mono/issues/109)

Standalone:

- [110](https://github.com/dertinfo/dertinfo-mono/issues/110) legacy auth tables
- [111](https://github.com/dertinfo/dertinfo-mono/issues/111) unused system settings
- [112](https://github.com/dertinfo/dertinfo-mono/issues/112) Auth0 claims that store database ids
- [113](https://github.com/dertinfo/dertinfo-mono/issues/113) `npm run start` aborts when a port is in use
- [114](https://github.com/dertinfo/dertinfo-mono/issues/114) website authentication tests
- [115](https://github.com/dertinfo/dertinfo-mono/issues/115) API image storage identity and leftover settings
- [116](https://github.com/dertinfo/dertinfo-mono/issues/116) remove source `workflow_dispatch`
- [117](https://github.com/dertinfo/dertinfo-mono/issues/117) Auth0 tenant names
- [118](https://github.com/dertinfo/dertinfo-mono/issues/118) Azure SQL firewall
- [119](https://github.com/dertinfo/dertinfo-mono/issues/119) rename `main.prod.bicepparam`
- [120](https://github.com/dertinfo/dertinfo-mono/issues/120) retire the old Azure estates
- [121](https://github.com/dertinfo/dertinfo-mono/issues/121) issue and pull request templates
- [122](https://github.com/dertinfo/dertinfo-mono/issues/122) API integration tests in CI
- [123](https://github.com/dertinfo/dertinfo-mono/issues/123) Ionic app Angular upgrade
- [124](https://github.com/dertinfo/dertinfo-mono/issues/124) Linux API App Service
- [125](https://github.com/dertinfo/dertinfo-mono/issues/125) Azure DevOps decommission
- [126](https://github.com/dertinfo/dertinfo-mono/issues/126) subscription policy deny check
- [127](https://github.com/dertinfo/dertinfo-mono/issues/127) a group that is not set up can still be registered
- [128](https://github.com/dertinfo/dertinfo-mono/issues/128) share local durable data across run types
- [129](https://github.com/dertinfo/dertinfo-mono/issues/129) how dependencies are installed

Not filed, because the work already shipped or the note was a decision rather than open work: the Azure estate layout, the Bicep and infra-pipeline design, "add infrastructure as code", "wire production CD", and a review of alternatives to Static Web Apps. Those links now point at [CI/CD](../../technical/infra/cicd.md), [Bicep standards](../../technical/standards/bicep/README.md), or the hosting page.

## Why the work was completed

The planned-fixes folder had become a second backlog. A person picking up the work had to find a markdown page, and the docs told agents to keep writing those pages. GitHub issues are the tracker, and each issue now has enough of the old note that the page can go.

## Date the work was started

2026-10-17

## Date the work was completed

2026-10-17

## Issues that were encountered on the way

- Issue types are an organisation feature. `dertinfo` is a user account, so the type field cannot be set. Labels are the tag that exists on the repository.
- The site-admin email test is implemented on `feature/systemadmin-email-test`, which is not merged and has no pull request. On `main` the note was still open, so it was filed as [issue 130](https://github.com/dertinfo/dertinfo-mono/issues/130). That branch should close the issue if it already does the work.
- Two smoke notes (a second ticket copying the first, and single versus multiple ticket choice) were on that same branch and not yet on `main`. They are [issue 94](https://github.com/dertinfo/dertinfo-mono/issues/94) and [issue 95](https://github.com/dertinfo/dertinfo-mono/issues/95), so deleting the page on `main` does not drop them.

## References to any best practices that we found

- [Managing issue types in an organization](https://docs.github.com/en/issues/tracking-your-work-with-issues/configuring-issues/managing-issue-types-in-an-organization) — types are organisation-level. The defaults are task, bug, and feature. This repository's owner is a user, so they are not available.
- [Managing labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels) — default labels include `bug`, `enhancement`, and `documentation`.
- [Quickstart for GitHub Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/quickstart) — sub-issues group a list without making one undifferentiated ticket.

## Any remaining issues that we may wish to address

- If `dertinfo` later becomes an organisation, set issue types on the issues above. The labels already record bug versus enhancement versus documentation.
- [Issue 121](https://github.com/dertinfo/dertinfo-mono/issues/121) is the template polish that used to be a planned-fix page. It was not done in this change.
