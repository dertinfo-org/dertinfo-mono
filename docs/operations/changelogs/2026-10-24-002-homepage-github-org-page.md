# Homepage GitHub link opens the organisation page

## Summary of the work completed

The website homepage **View on GitHub** button now opens [https://github.com/dertinfo-org](https://github.com/dertinfo-org), the organisation page whose welcome README introduces the organisation. [Pull request 139](https://github.com/dertinfo-org/dertinfo-mono/pull/139) had pointed that button at [https://github.com/dertinfo-org/dertinfo-mono](https://github.com/dertinfo-org/dertinfo-mono). This follow-up leaves that merged change log entry as it was and only changes the button destination.

## Why the work was completed

The homepage invites people to help with the open-source project. The organisation page is the front door: it shows the welcome README, and a visitor can open repositories from there. Opening `dertinfo-mono` directly skips that page. Pull request 139 merged with the repository URL before a later commit on that branch could retarget the button, so this change is a new branch from `main`.

## Date the work was started

2026-10-24

## Date the work was completed

2026-10-24

## Issues that were encountered on the way

- Pull request 139 merged while a follow-up commit that changed the button to `https://github.com/dertinfo-org` was still only on `cursor/homepage-github-org-link-c78c`. Those commits cannot be merged, so this work is a new branch from current `main`.
- Branch naming conflicts. [GitHub Flow](../../../.cursor/rules/github-flow.mdc) asks for `feature/` or `hotfix/` branches. This cloud agent run requires `cursor/<description>-c78c`. The branch is `cursor/homepage-github-org-page-c78c`. No GitHub issue number exists for this destination change, so the pull request description does not use a closing keyword.

## References to any best practices that we found

- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — branch from `main`, one concern per pull request, merge via pull request.
- [Change logs](./README.md) — a follow-up on the same day gets the next sequence number (`002`) and a new index row. The merged `001` page stays as the record of pull request 139.

## Any remaining issues that we may wish to address

- `apps/dert-web/README.md` still documents the predecessor repositories (`github.com/dertinfo/dertinfo` and `github.com/dertinfo/dertinfo-app`). Updating that historical readme is separate from the public homepage link.
