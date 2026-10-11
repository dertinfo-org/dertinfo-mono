---
name: Dert of Derts result
type: entity
status: active
updated: 2026-09-27
id: entity.dod-result
---

# Entity: Dert of Derts result

## Description

One person's scores and comments on a [Dert of Derts submission](dod-submission.md). The marks follow the same kind of criteria as a live competition: music, stepping, sword handling, dance technique, presentation, buzz, and characters, plus overall comments. This result belongs to the online programme. It is separate from a venue [score](score.md) on a Dert competition day. See [Dert of Derts](../features/web/dod-programme.md).

A complaint about the scores or the comments is recorded against the result. It is not a separate object.

## What can be done

- **Give** — a participant in the programme, while watching a submission.
- **Include in the aggregate** — dod-admin, or the programme rules. An included result counts toward the submission's scores.
- **Mark official** — dod-admin. An official result is treated as part of the formal scoring.
- **Complain** — a participant can raise a complaint about the scores, the comments, or both. While a complaint is outstanding, the result can be held out of the aggregate.
- **Resolve the complaint** — dod-admin. The complaint is validated or rejected, and then resolved.

## States

This entity has no single lifecycle. These settings apply together:

- **Official** — part of the formal scoring.
- **Included in scores** — counts in the submission's aggregate.
- **Complaint outstanding** — a complaint is open, and the result may be held back.
- **Complaint resolved** — the complaint has been validated or rejected.

See [Domain glossary](../system/domain-glossary.md).
