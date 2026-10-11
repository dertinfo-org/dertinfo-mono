---
name: Run competitions
type: feature
status: active
updated: 2026-09-27
id: competitions.run
roles: [event-admin]
---

# Feature: Run competitions

## Description

Event administrators set up and run competitions within an event: venues, judges, dances, score structure, paperwork, and reporting used to determine awards. For a typical **Dert**, four competitions are expected.

## Typical Dert competitions

| Competition | Notes |
|-------------|--------|
| **Main** | Across **five venues**, with a dance in each venue. Primary marking set (see below). |
| **Traditional** | Uses a **different marking set** aligned to traditional rules. |
| **Spotlight** | Separate competition in the usual Dert set. |
| **DERTY** | **Dancing England Rapper Tournament Youth** — for youth teams; uses a **different marking set** for young dancers. |

## Typical main-competition marking criteria

Music, stepping, sword handling, dance technique, presentation, characters, and buzz.

## User roles

- **event-admin** — configure and operate competitions for their events; view and filter scores on the website

## Behaviour

- From registration information, prepare the **dances** expected over the day.
- Create **paperwork** for each dance according to the judges announced and the **score sets** those judges mark against.
- Configure venues (main competition is multi-venue; scores aggregate across venues).
- Allocate judges and score sets (traditional and DERTY use different marking sets from main).
- From the event homepage, **Competitions** shows how many competitions are available for the event.
- On the website, **view scores** and filter by **venue**, **team**, and **award**.
- Use reporting to identify winners for **awards** ahead of the awards ceremony.

### Typical main-competition awards

- Best newcomer
- Veterans
- **Steve Marris** — includes **characters** scores in the calculation
- **Overall winner** — does **not** include marks for the **characters** category

## Limitations

- Live score entry at the venue may be done by venue admin or event admin — see [Venue score capture](../app/venue-score-capture.md).
- Publishing results is exclusively an event-admin function — see [Publish competition results](results-publish.md).

See [Domain glossary](../../system/domain-glossary.md).

## Scenarios

The smoke check is only that Competitions shows a count. Venues, judges, dances, marking, and awards are a later pass and are not part of this scenario.

```gherkin
Feature: Run competitions
  As an event administrator
  I want to open competitions for my event
  So that I can see how many there are

  Scenario: Event administrator sees the competition count
    Given the event is set up
    When the event administrator selects Competitions from the event homepage
    Then the number of competitions available for the event is shown
```

