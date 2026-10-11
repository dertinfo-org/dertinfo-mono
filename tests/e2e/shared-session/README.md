# Shared session

Fixtures share this folder. A website fixture and an app fixture both read and write the same session here, so a later fixture can continue from an earlier one.

`chain.json` holds the ids one fixture provides for the next, such as the event id and the group id. `sessions/` holds the accepted cookie and each persona's signed-in browser storage.

These files are created while a run is in progress. A passing run removes them when `clearSession` is true. A failing run leaves them. The README stays.
