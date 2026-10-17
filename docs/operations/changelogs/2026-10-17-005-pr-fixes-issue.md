# A pull request that fixes a bug names the issue so GitHub closes it

## Summary of the work completed

The GitHub Flow guidance now says that a pull request which fixes a bug must include `Fixes #<issue>` in the description. GitHub then closes that issue when the pull request merges into `main`.

## Why the work was completed

Pull request 135 fixed [issue 127](https://github.com/dertinfo/dertinfo-mono/issues/127) but did not use a closing keyword, so the issue stayed open after merge and had to be closed by hand.

## Date the work was started

2026-10-17

## Date the work was completed

2026-10-17

## Issues that were encountered on the way

None.

## References to any best practices that we found

- [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) — `Fixes`, `Closes`, or `Resolves` plus the issue number closes the issue on merge into the default branch.

## Any remaining issues that we may wish to address

None.
