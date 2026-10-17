# Group registration opens with a note to prepare members and guests

## Summary of the work completed

The group registration panel shows an information banner above the stepper. It uses the theme primary colour and an info icon, and tells the group to add members and guests to the group profile first. The form then selects from those records, with new members or guests added on the next page.

## Why the work was completed

Registration is easier when the people who will attend are already on the group profile. The note sits above the stepper so it is visible before the overview, tickets, and terms steps.

## Date the work was started

2026-10-17

## Date the work was completed

2026-10-17

## Issues that were encountered on the way

The text block sat on top of the info icon. A left margin did not move it clear, because the paragraph was a full-width box starting at the same edge as the icon. The banner is now two columns: the icon, a 10px gap, then the text.

## References to any best practices that we found

- [Material Design banners](https://m2.material.io/components/banners/) — a banner is a prominent message placed with the content it describes.
- The banner uses the existing `mat-bg-primary` theme class and `mat-icon`, rather than a new colour.

## Any remaining issues that we may wish to address

The signed-in local account used while building this had no groups, so the register route could not be opened in that session. The layout was checked by the person opening the pull request.
