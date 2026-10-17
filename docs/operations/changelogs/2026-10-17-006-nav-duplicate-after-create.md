# A new group or event appears once in the left navigation

## Summary of the work completed

Creating a group or an event no longer lists that name twice in the website left navigation. The sidenav keeps its own copy of the cached group and event lists. The dashboard pin emits a new array instead of pushing onto the list it already holds. [Issue 13](https://github.com/dertinfo/dertinfo-mono/issues/13).

## Why the work was completed

The list caches replay one array to every subscriber. The sidenav stored that array, and the dashboard stored it too. Create appended the new group or event from both places, so the sidenav rendered the name twice. A refresh loaded a new array from the API and the extra entry was gone. Copying the list, and emitting a new array from the pin, keeps those two updates on separate lists.

## Date the work was started

2026-10-17

## Date the work was completed

2026-10-17

## Issues that were encountered on the way

`clearCache()` runs before create, which looked like it would detach the sidenav from the dashboard. It only drops the observable used for the next request. The array already delivered stays shared, so the second append still landed in the navigation.

## References to any best practices that we found

- [Cache an HTTP response with `publishReplay`](https://blog.angularindepth.com/fastest-way-to-cache-for-lazy-developers-angular-with-rxjs-444a198ed6a6) — the pattern already used by the group and event list caches. Subscribers receive the same emitted array, so that array must not be mutated in place.

## Any remaining issues that we may wish to address

None for this bug. Issue 13 stays open until this pull request is merged.
