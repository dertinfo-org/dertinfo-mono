# An unset group cannot be registered for an event

## Summary of the work completed

Creating a registration now fails when the group is not set up. On the group admin screen, that group shows a yellow banner asking for contact details, with **Set up now**. Promoted events and **Available / New** are not listed, so those screens do not open registration. [Issue 127](https://github.com/dertinfo/dertinfo-mono/issues/127).

## Why the work was completed

The dashboard already keeps an unset group on setup, so the chance of opening group admin was low. The create-registration API did not check the group. A call there could still attach an incomplete group to an event. The API check is the protection. The banner and the hidden event lists stop the same path in the website.

## Date the work was started

2026-10-17

## Date the work was completed

2026-10-17

## Issues that were encountered on the way

The theme class `mat-bg-warn` is the error red (`#f44336`). The yellow used on the banner is the accent colour (`#ffd97d`), via `mat-bg-accent`.

The banner sat 6 pixels above the left pane and left 21 pixels before the next card. Cards use a margin of `0.333333rem`, and the gap between them is 10 pixels. The banner now uses that same margin.

## References to any best practices that we found

- [Material Design banners](https://m2.material.io/components/banners/) — a banner is a prominent message placed with the content it describes.
- The banner follows the registration stepper: an icon, the text beside it, and the action on the right. It uses the existing theme classes rather than a new colour.

## Any remaining issues that we may wish to address

The dashboard still does not offer **Admin** for a group that is not set up. That is the existing path into setup. Issue 127 stays open until this pull request is merged.
