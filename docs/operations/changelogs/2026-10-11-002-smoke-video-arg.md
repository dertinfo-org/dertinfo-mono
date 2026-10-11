# Smoke runners keep the video mode, and the app has its own smoke command

## Summary of the work completed

`npm run test:web:smoke -- --video all` now records the website fixtures. The smoke runner was keeping `--video` and then treating `all` as a fixture name, so the suite stopped before the first fixture. `--video`, `--event-data`, and `--group-data` keep the value that follows them. `--base-state` and `--clear-session` stay with the smoke runner.

The same flag handling is shared, and the app has `app/run-smoke.mjs`. `npm run test:app:smoke` runs the venue score-capture fixture. That fixture applies `system-basic`. The runner clears the shared session at the start and again when the run passes. `npm run test:app:core` still starts that fixture directly.

## Why the work was completed

Video on the website smoke command is how a failing fixture is inspected. The command printed in the guide did not run. The app needed the same entry point as the website, at the root of `tests/e2e/app`, so one fixture today and further fixtures later start the same way.

## Date the work was started

2026-10-11

## Date the work was completed

2026-10-11

## Issues that were encountered on the way

`node web/run-smoke.mjs --video all` printed `Unexpected all` and exited. The word after `--video` did not start with `--`, so the runner rejected it. The value is now read with the flag.

## References to any best practices that we found

- [npm run](https://docs.npmjs.com/cli/v10/commands/npm-run-script) — `--` passes the following arguments to the script. The runner must then read the flag and its value.
- [Website smoke tests](../../technical/guides/website-smoke-tests.md) — how to run both smoke commands and record video.
- [Playwright standards](../../technical/standards/playwright/README.md) — where `web/run-smoke.mjs` and `app/run-smoke.mjs` sit.

## Any remaining issues that we may wish to address

The app smoke list has one fixture, venue score capture. Another app feature with tests would be another step in `app/run-smoke.mjs`, with `--base-state none` when it must keep the database the first fixture left behind.
