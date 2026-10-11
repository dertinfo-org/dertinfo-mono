---
name: Engineering standards
type: index
status: active
updated: 2026-09-27
---

# Engineering standards

Technology-wide conventions (style, constructs, naming) that apply wherever that stack is used in the monorepo — not product capabilities and not per-app getting started.

| Technology | Guide |
|------------|--------|
| [Angular](angular/) | Client structure and DertInfo feature pattern (conductor / tracker / repository / resolver) |
| [Bicep](bicep/) | `infra/bicep` layout, AVM vs local modules, extendable params, `prerequisitesExist` |
| [PowerShell](powershell/) | `infra/scripts` layout, comment-based help, and operator-script body order |
| [Playwright](playwright/) | How a fixture maps to a Gherkin feature, how a test maps to a scenario, and how page objects and session state are used |

Create a new folder under `standards/` when documenting the first house standard for another stack (e.g. .NET).
