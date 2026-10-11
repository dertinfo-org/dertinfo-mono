---
name: Image handling
type: system
status: active
updated: 2026-09-26
id: system.image-handling
roles: []
---

# System capability: Image handling

## Purpose

When an image is **uploaded**, the platform **resizes** it into sizes suitable for use in the application so the same image can be reused in different locations (galleries, overviews, and similar).

## Behaviour

- Upload triggers processing into application-ready sizes.
- Processed images are available for display wherever the product references them.

## Dependencies

None at the capability layer (technical implementation may use background processing / storage).

## Limitations

- Exact sizes and formats are technical configuration, not product vocabulary here.

See group image management under [Create and manage group](../features/web/groups-manage.md). Storage paths and which screen requests which size: [Images](../../technical/subsystems/images.md).
