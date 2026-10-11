# Planned: Remove unused system settings

**Status:** Not started. `EnsureSeedData` still inserts these rows. No current API, website, or app code reads them.

**Related:** [`DertInfoContextExtensions.EnsureSeedData`](../../../apps/dert-api/src/dertinfo-repository/DertInfoContextExtensions.cs), `tests/e2e/shared-state/system-empty/baseline.json`.

---

## Keep

These DERT of DERTs settings are read by the API:

- `SYSTEM-DOD-RESULTSPUBLISHED`
- `SYSTEM-DOD-OPENFORPUBLIC`
- `SYSTEM-DOD-PUBLICRESULTSFORWARDED`
- `SYSTEM-DOD-OFFICIALRESULTSFORWARDED`
- `SYSTEM-DOD-JUDGEPASSWORDS`

## Remove

Checked on 2026-10-10. Each key below appears only in the seed (and in the smoke baseline that records that seed). Mail is sent through SendGrid, not these SMTP rows. Image storage uses `StorageAccount__Images` configuration, not `CloudStorageContainer`.

- `SYSTEM-JUDGEACCESSTOKEN`
- `SMTPServer`
- `SMTPUsername`
- `SMTPPassword`
- `CloudStorageContainer`
- `SYSTEM-DERTYEAR`
- `SYSTEM-FORGOTTEN-PASSWORD-EMAIL-TEMPLATE-ID`

`SYSTEM-DERTYEAR` is marked deprecated in the seed, with a note that the website still relied on it. The current website does not reference that key. `SYSTEM-FORGOTTEN-PASSWORD-EMAIL-TEMPLATE-ID` was not in the original list; it is unused in the same way.

## Later change

Stop inserting these rows in `EnsureSeedData`. Delete any existing rows. Update `tests/e2e/shared-state/system-empty/baseline.json` so the empty baseline matches the settings startup still writes.
