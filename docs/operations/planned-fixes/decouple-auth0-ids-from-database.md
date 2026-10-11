# Planned: Decouple Auth0 claims from database ids

**Status:** Not started. The smoke pack still forces database ids so Auth0 claims can match them.

**Related:** [Authentication](../../technical/subsystems/authentication.md), `tests/e2e/shared-state/`.

---

## Why

Auth0 `app_metadata` stores event, group, and venue permissions as the database primary keys (`eventadmin`, `groupadmin`, `groupmember`, `venueadmin`). The app parses those claim values and compares them with `Events.Id`, `Groups.Id`, and `Venues.Id`.

That couples a login to SQL identity order. A reseed, an extra row, or a restored database changes the key, and the token no longer opens the right event, group, or venue. Competitions have the same shape of problem if a later claim starts carrying a competition id.

The `system-basic` pack makes this visible with `Auth0ForcedId`. The loader writes that number into the identity column only so the current claim check succeeds. It is not an id the rest of the pack needs.

## Later change

Give events, groups, venues, and competitions a stable identifier that Auth0 can store, separate from the database identity column. Logins then keep working when identity values move. The smoke pack can drop `Auth0ForcedId` once the API and the app authorize on that stable identifier.
