# Homepage GitHub link points at the organisation repository

## Summary of the work completed

The website homepage **View on GitHub** button now opens [https://github.com/dertinfo-org/dertinfo-mono](https://github.com/dertinfo-org/dertinfo-mono). It previously opened `https://github.com/dertinfo`, the personal account the repository left when it moved to the `dertinfo-org` organisation. The footer and other public pages in `apps/dert-web` have no second link to this repository.

## Why the work was completed

The public homepage invites people to help with the open-source project and sends them to GitHub. After the move, that button landed on the old account and the repository was no longer there. The button is the way a visitor reaches this codebase, so it needs the organisation repository URL.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- Branch naming conflicts. [GitHub Flow](../../../.cursor/rules/github-flow.mdc) asks for `feature/` (or `hotfix/`) branches from `main`. This cloud agent run requires `cursor/<description>-c78c`. The branch is `cursor/homepage-github-org-link-c78c`, based on `main`, and is independent of pull request 138. No GitHub issue number exists for this broken link, so the pull request description does not use a closing keyword.
- `npm run web:lint` (`ng lint`) exits immediately because `apps/dert-web/src/client/angular.json` has no `lint` target. [Web Src CI](../../../.github/workflows/web-src-ci.yml) already sets that step to `continue-on-error: true`. This change does not add a linter.
- `apps/dert-web/README.md` still links to the older repositories `dertinfo/dertinfo` and `dertinfo/dertinfo-app`. Those are not this monorepo, so they were left as written.

## References to any best practices that we found

- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — branch from `main`, one concern per pull request, merge via pull request.
- [Change logs](./README.md) — the entry is in the same pull request as the link change.
- Website checks in [`.cursor/rules/frontend-web.mdc`](../../../.cursor/rules/frontend-web.mdc): `npm run web:lint` and `npm run web:build`. Continuous integration for this app runs `npm run lint` and `npm run build:hosted` ([`web-src-ci.yml`](../../../.github/workflows/web-src-ci.yml)).

## Any remaining issues that we may wish to address

- `apps/dert-web/README.md` still documents the predecessor repositories (`github.com/dertinfo/dertinfo` and `github.com/dertinfo/dertinfo-app`). Updating that historical readme is separate from the public homepage link.
- Docs, rules, and older change log pages across the monorepo still cite `https://github.com/dertinfo/dertinfo-mono` for issues and pull requests that were opened before the organisation move. Those URLs are outside this website change.
