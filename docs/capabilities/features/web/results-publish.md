---
name: Publish competition results
type: feature
status: active
updated: 2026-10-04
id: results.publish
roles: [event-admin, group-admin, group-member, member, public-user]
---

# Feature: Publish competition results

## Description

After the competition day and awards ceremony, the event administrator marks each competition as **results published**. That unlocks public award outcomes and own-team score detail for authorised users.

## User roles

- **event-admin** — mark competitions results published
- **public-user** — see published award / competition outcomes on the public website
- **group-admin**, **group-member**, **member** (when associated with a team) — after publish, view **their own** team’s scores and score sheets in the app

## Behaviour

1. Competition typically runs over a day; awards ceremony in the evening.
2. Event admins use reporting to determine winners for **awards** (overall and category).
3. After the ceremony, mark the competition **results published**.
4. **Public website:** publishes competition results focused on who won each award (aggregations / award outcomes — not other groups’ detailed score sheets).
5. **Website and app:** group admins and team-associated members can see scores and score sheets for **their** team only. On the website, open the group with **View**, then the event.

## Limitations

- Members of other groups cannot see another group’s score sheets.
- Publishing is per competition and controlled by the event admin.

See [Run competitions](competitions-run.md) and [Domain glossary](../../system/domain-glossary.md).
