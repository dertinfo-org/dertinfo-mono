# Documentation guide

Defines the documentation system for this monorepo: three tracks, templates, metadata, and rules for humans and AI agents.

## Purpose

| Track | Answers | Lives under |
|-------|---------|-------------|
| Capabilities | WHAT the platform can do | `docs/capabilities/` |
| Technical | HOW it is built and operated | `docs/technical/` |
| Operations | Working history while solving things in-repo | `docs/operations/` |

Docs explain the project in a discoverable way. Open work is a [GitHub issue](https://github.com/dertinfo/dertinfo-mono/issues). These docs are not a ticket backlog.

Per-app **getting started** stays in each app README; shared and estate-level material belongs here, with READMEs linking in.

## Folder structure

```
docs/
  README.md
  documentation-guide.md
  capabilities/
    README.md
    capabilities.yaml
    roles/
    features/
      web/
      app/
    entities/
    system/
  technical/
    architecture/
    guides/
    infra/
    subsystems/            # Auth0, security, …
    standards/             # Angular, .NET, … technology conventions
  operations/
    changelogs/
    investigations/
    security/              # Point-in-time operational security reviews
    agents/
```

### Create on first use (do not scaffold empty)

| Folder | When to create |
|--------|----------------|
| Further `technical/subsystems/` pages | When a new named subsystem needs a deep dive |
| Further `technical/standards/<tech>/` | When documenting house rules for another stack |
| Further capability domains | As reverse-engineering fills the catalogue |
| `operations/security/` | When recording an operational security review (e.g. workflow / OIDC gates) |

### Do not create

| Folder | Why |
|--------|-----|
| `technical/api/` | OpenAPI / Swagger (`packages/shared-contracts/`, API Swagger UI) is the source of truth |
| `technical/data-model/` | Same — avoid duplicating schemas |
| `operations/decisions/` | Outcomes live in changelogs, investigations, and code |
| `operations/planned-fixes/` | Open work is a GitHub issue. Do not park a backlog next to the code |

## Technical split

| Folder | Owns |
|--------|------|
| `technical/architecture/` | Estate structure and subsystem responsibilities |
| `technical/subsystems/` | Deep technical topics (Auth0, security, …) |
| `technical/standards/` | Stack-wide conventions (Angular constructs, style, …) |
| `technical/guides/` | Cross-cutting how-tos (e.g. run the whole estate, contributing) |
| `technical/infra/` | Configuration model, CI/CD, secrets rotation, tooling setup |
| App README | That component’s local install / F5 / debug only |

## Capabilities and `capabilities.yaml`

Capabilities are **implementation-free**: describe user-visible behaviour, not Auth0, Angular, Azure Functions, etc.

- **Markdown** = narrative source of truth.
- **`capabilities.yaml`** = thin machine inventory for gap detection during reverse-engineer / upgrades.
- **Do not regenerate** markdown from YAML.

Each inventory entry:

```yaml
- id: auth.login
  title: Log in
  status: active          # active | planned | deprecated
  path: features/web/auth-login.md
  roles: [public-user, member]
```

Adding a capability = YAML row **and** markdown page (same `id` in frontmatter). Features list applicable **roles**; roles link back to features. Entities use the same inventory shape (`id: entity.<slug>`).

## Frontmatter (light)

```yaml
---
name: Log in
type: feature          # role | feature | entity | system | architecture | guide | …
status: active
updated: YYYY-MM-DD
id: auth.login         # required for capability pages
---
```

Do not maintain heavy `depends_on` / `provides` graphs unless they stay accurate.

## Page templates

### Role (`capabilities/roles/<role>.md`)

```markdown
---
name: Member
type: role
status: active
updated: YYYY-MM-DD
id: member
---

# Role: Member

## Summary
…

## Capabilities
- [Log in](../features/web/auth-login.md)

## Limitations
…
```

### Feature (`capabilities/features/web/<feature>.md` or `capabilities/features/app/<feature>.md`)

```markdown
---
name: Log in
type: feature
status: active
updated: YYYY-MM-DD
id: auth.login
roles: [public-user, member]
---

# Feature: Log in

## Description
…

## User roles
…

## Behaviour
…

## Limitations
…
```

Add a `## Scenarios` section when a feature has Gherkin. Given, When, Then, And, and But stay in one block. The Playwright runner does not read that page. A feature maps to a fixture, and a scenario maps to a test, as described in [Playwright standards](technical/standards/playwright/README.md). How to run the website suite is in [Website smoke tests](technical/guides/website-smoke-tests.md).

### Entity (`capabilities/entities/<entity>.md`)

An object in the platform: what it is, what can be done to it, and which states it can be in. Actions name the role, the feature, the state change, and side effects (another entity created, an email sent, who can now see it). The glossary stays the short vocabulary; entity pages are the lifecycle.

Entities with no lifecycle say so and list the settings that matter. Do not invent states.

```markdown
---
name: Registration
type: entity
status: active
updated: YYYY-MM-DD
id: entity.registration
---

# Entity: Registration

## Description
…

## What can be done
- **Submit** — group-admin, via [Submit event registration](../features/web/registration-submit.md). New or Submitted becomes Submitted. The registration becomes visible to the event admin, and a registration-submitted email is sent.

## States
- **New** — …
```

### System capability (`capabilities/system/<capability>.md`)

Same shape as features; use for cross-cutting platform behaviour that is not a single user-facing feature page.

### Investigation (`operations/investigations/<topic>.md`)

Summary, symptoms, evidence, root cause, resolution, follow-ups.

### Open work

File a GitHub issue. Include the problem, the current behaviour (paths that stay), why it matters, a suggested approach, what done looks like, and what is out of scope. Use the repository labels `bug`, `enhancement`, or `documentation` when one of those fits. Do not add a page under `docs/operations/` to track it.

### Changelog

See [operations/changelogs/README.md](operations/changelogs/README.md). Include the entry in the same pull request in nearly all cases. If there is any doubt about leaving it off, ask before opening the PR without one. Filenames are `YYYY-MM-DD-NNN-short-slug.md` (`NNN` = `001`, `002`, … for that completion date) so several entries on one day stay ordered in the file list. After the summary, each page has **Why the work was completed** (rationale).

## Agent rules

1. Never invent new top-level tracks or undeclared folders.
2. Never put technical stack detail in capability pages.
3. Update frontmatter `updated` when editing.
4. Update indexes when adding or removing documents.
5. When moving files, fix all links and `.cursor/rules` paths.
6. Preserve human-written content unless explicitly asked to delete it.
7. Open work is a GitHub issue. `operations/*` keeps changelogs, investigations, and security reviews. Do not add a planned-fixes backlog.

See also: [operations/agents/](operations/agents/).

## Non-goals

- Replacing GitHub Projects / Issues
- Duplicating OpenAPI / Swagger as hand-written API docs
- Mirroring every app README into `docs/technical/`
