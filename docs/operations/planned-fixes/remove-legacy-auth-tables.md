# Planned: Remove legacy auth tables

**Status:** Not started. The tables are still in the database. The activity attendance tables stay.

**Related:** [`DertInfoContext`](../../../apps/dert-api/src/dertinfo-repository/DertInfoContext.cs), [`AccessKey`](../../../apps/dert-api/src/dertinfo-models/Database/AccessKey.cs).

---

## Keep

`ActivityMemberAttendances` and `ActivityTeamAttendances` are still used. Registration creates those rows, and the website uses them when a member or team is given activities.

## Remove

Checked on 2026-10-10. Sign-in is Auth0. Nothing in the API, website, or app reads or writes these tables.

Old access-token permissions. The entity classes and `DbSet`s are still on the context, and nothing else uses them:

- `AccessKeys`
- `AccessKeyUsers`

Old ASP.NET SimpleMembership tables. They remain in the EF model snapshot. There is no current C# class for them:

- `webpages_Membership`
- `webpages_OAuthMembership`
- `webpages_Roles`
- `webpages_UsersInRoles`
- `UserProfile` (`webpages_UsersInRoles` points at this table)

## Later change

Drop the access-key entities from the model and add a migration that drops these tables. Update the smoke state loader if it still clears them by name.
