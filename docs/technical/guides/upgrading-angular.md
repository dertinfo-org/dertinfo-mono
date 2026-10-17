---
name: Upgrading Angular
type: guide
status: active
updated: 2026-10-17
---

# Upgrading Angular

How to take the website (`apps/dert-web`) up one Angular major. The Ionic app (`apps/dert-app`) is a separate client. This page does not cover that upgrade.

Do one major at a time, on a branch from `main`. The client lives in `apps/dert-web/src/client`. After the official steps, read the watch-list below before treating the hop as done. The existing website smoke suite is the functional check. The hop itself is recorded in a [change log](../../operations/changelogs/README.md).

## Official guidance

Use the Angular sites for the compiler, the supported Node, TypeScript, and RxJS ranges, and the `ng update` steps for the versions you are leaving and joining. Open the update guide on the **advanced** path and set the From and To versions for this hop.

| What you need | Where |
|---------------|--------|
| Step-by-step update for the versions you are moving between | [Angular Update Guide](https://angular.dev/update-guide) |
| When `ng update` is enough, and where the other update pages sit | [Keeping your Angular projects up-to-date](https://angular.dev/update) |
| `ng update` command | [`ng update`](https://angular.dev/cli/update) |
| One major at a time, and what a breaking change means | [Versioning and releases](https://angular.dev/reference/releases) |
| Node, TypeScript, and RxJS for each Angular version | [Version compatibility](https://angular.dev/reference/versions) |
| Material 15 MDC components and the migration schematic | [Migrating to MDC-based Angular Material](https://material.angular.io/guide/mdc-migration) |

`ng update` with no arguments lists what is available. To move one major, pass that major for the CLI and the framework, and take the latest patch of that major:

```bash
ng update @angular/cli@^<major> @angular/core@^<major>
```

Material, CDK, and the other Angular packages follow the same major as `@angular/core`. Third-party packages are aligned only to a release that declares that Angular major.

## Watch-list from the Angular 14 to 15 upgrade

These showed up on this website during the move to Angular 15.2. The update guide does not list them as application steps. Check them again on later hops. The full record of that hop, including package versions, is [Website upgraded from Angular 14 to Angular 15](../../operations/changelogs/2026-10-04-002-web-angular-15.md).

### A package that peers the new Angular may still be the wrong release for this site

Angular 15 still allows RxJS 6, and this site stayed on RxJS 6. That choice fixed several package versions:

- `ngx-quill` 18 and the 20/21 line peer Angular 15 and require RxJS 7. The site stayed on **ngx-quill 17.0.0**, which peers `@angular/core >=13` and `rxjs ^6.5.3 || ^7.4.0`.
- `@swimlane/ngx-datatable` 20.1.0 peers `rxjs ^6.6.3`. RxJS moved from 6.5.5 to **6.6.7**, still on RxJS 6.
- `@auth0/auth0-angular` stays at **2.2.3**. A newer 2.x uses Angular 15-only APIs (`makeEnvironmentProviders`).
- `ng2-charts` 2.4.3 is still a View Engine build (`ngcc` processes it). Its peer range is `@angular/core >=7.2.0`, so it was left in place with `chart.js` 2.

`ng update` refused to start until `--force`, because `ngx-cookie-service` 13 and `ngx-quill` 15 do not peer Angular 15. The schematics were applied with that flag. After the packages were aligned, `npm install` succeeded with no `force` and no peer errors, and `apps/dert-web/src/client/.npmrc` (`force = true`) was removed. On a later hop, use `--force` only to get the schematic through a known peer block, then install cleanly and drop `force` again.

`@angular/flex-layout` **15.0.0-beta.42** is the last release. Angular's own note is [Modern CSS in Angular layouts](https://blog.angular.io/modern-css-in-angular-layouts-4a259dca9127). There is no Angular 16 build, so the next hop replaces it.

### One deep RxJS import was still living on `rxjs-compat`

Nothing imported the `rxjs-compat` package by name. `group-members.component.ts` imported `Observable` from `rxjs/Observable`, which only that package provides. Removing `rxjs-compat` meant changing that import to `rxjs`. Search for `rxjs/` deep imports before deleting a compat package on a later hop.

### The stylesheet resolver follows package `exports`

The only `~` imports were the three ngx-datatable CSS files in `src/assets/styles/styles.scss`. Angular 15 honours the package `exports` field, and those CSS files are not exported, so the build failed. They are now relative paths under `node_modules`. On a later hop, search stylesheets for `~` imports before assuming the production build is clean.

### Reverting the CLI's `tsconfig` edit does not restore the old emit

The Angular 15 schematic set `tsconfig.json` `target` to `ES2022` and added `useDefineForClassFields: false`. Those edits were reverted so the checked-in target stayed `es2020`. The CLI still applies ES2022 at build time and still warns. Browserslist entries that need ES5 (`kaios 2.5`, `op_mini all`) are ignored. `.browserslistrc` and `src/polyfills.ts` were left as they were. If a later schematic rewrites `target`, decide whether the checked-in file should match what the CLI already emits.

### This machine's default Node can be outside the Angular range

Angular 15.2 supports Node `^14.20 || ^16.13 || ^18.10`. The Angular 15 CLI does not run on Node 24. Update and `ng build` used Node **16.20.2**. Node 18's npm writes `lockfileVersion` 3, so installs stayed on Node 16 to keep lockfile version 2. The Static Web Apps CLI on this machine requires Node 18 or newer, so the local proxy on port 44200 ran on Node 24 while `ng serve` used Node 16. CI and the website Docker image stay on Node 16. The engine floor is recorded in [Configuration](../infra/configuration.md). On a later hop, read the compatibility table first and keep the lockfile's npm major on the Node version that wrote it.

### Material MDC replaced the DOM this site's CSS and smoke suite expect

Material 15 both introduces the legacy components and ships `ng generate @angular/material:mdc-migration`. Material 17 removes the legacy entry points and that schematic. This hop ran the schematic in the same upgrade so the site did not stay on `MatLegacy*`. The themes still build with `mat.define-light-theme($primary, $accent)`, and the production build still warns that the theme is not a color, typography, and density map.

What that markup change did here:

- A `placeholder` on `mat-select`, `matInput`, or a textarea inside `mat-form-field` is not a floating label. Those placeholders became `<mat-label>`. An empty `placeholder=""` on the top-bar select was left.
- A resting `mat-label` covers the input, so a Playwright click lands on the label. Date fields and other controls in the smoke suite use `click` and `fill` with `force: true`. The long label "Tickets Available / Registration Open" covered `registrationOpenDate`.
- `placeholder` on `mat-select` is no longer the accessible name. The first smoke failure after the migration was the Target Audience combobox.
- List content is `mdc-list-item__content` and `mat-mdc-list-item-unscoped-content`. The avatar slot is `[matListItemAvatar]` only. `[mat-list-avatar]` stays in the unscoped content, so pictures sat in the wrong place until the registration lists used the new directives. Rules that only targeted `.mat-list-item-content` or `.mat-list-text` matched nothing, which is why the sidebar wrapped and clipped.
- The accordion still finds `mat-list-item` as an element. The old host class is gone.
- A ripple rule that sets `transform: scale(...)` stops Material's fade-out. The sidebar ripple is clipped with `clip-path` only, and only under `.sidebar-panel`.
- `app-addition-header` styles are encapsulated. Copying the same markup into a page template does not pick up that padding. The card is a column flex container, so `align-items: center` centers the title sideways. The title's text includes the icon name, so an exact text match for "Invoices & Payments" misses the header. The smoke suite waits on `app-addition-header` filtered by that text.
- A section header inside `fxLayout="row"` shrinks and wraps. The header sits above the row.
- The dialog overlay pane is `cdk-overlay-pane`. It does not carry `mat-mdc-dialog-panel`. Width for `.modal-min` is set with `:has(.modal-min)` on that pane.
- `data-testid="public-history"` collapsed to height 0 when `showcase/events` returned an empty list. Playwright treats height 0 as hidden. A static "History" heading inside that container keeps the page visible on a clean database.

Leave Material's own CSS in `node_modules` alone. Shared layout belongs in `styles.scss` and the shared header components. Working notes from the layout pass are under `docs/operations/visual-iterations/`.

### The next hop is already constrained by what this one left in place

The list written at the end of the 14 to 15 hop said Angular 16 required RxJS 7, that flex-layout had to be replaced, and that `ng2-charts` 2 was still View Engine. Checked against the [version compatibility](https://angular.dev/reference/versions) table, Angular 16.2 still allows RxJS `^6.5.3 || ^7.4.0` and Node `^16.14.0 || ^18.10.0`. The RxJS line was wrong. Flex-layout and the View Engine chart were real stops, and they were cleared before `ng update`. What the 15 to 16 hop left is in the watch-list below.

## Watch-list from the Angular 15 to 16 upgrade

These showed up on this website during the move to Angular 16.2. The update guide does not list them as application steps. Check them again on later hops. The full record, including package versions, is [Website upgraded from Angular 15 to Angular 16](../../operations/changelogs/2026-10-04-003-web-angular-16.md).

### Read the compatibility table before treating a leftover as a requirement

The 14 to 15 notes said Angular 16 requires RxJS 7. The table does not. This site stayed on RxJS **6.6.7** and `ngx-quill` **17.0.0**. Later `ngx-quill` releases are what want RxJS 7. On the next hop, re-read the table for that major. Do not copy a constraint forward because the previous notes said so.

### `ng update` can succeed while the next install still fails

`ng update @angular/cli@16 @angular/core@16` and `ng update @angular/material@16` completed with no `--force`. A later `npm install` then failed because `ng2-file-upload` 4 peers `@angular/common` `^15` and `ngx-cookie-service` 15 peers `^15`. Those moved to **5.0.0** and **16.1.0**. After that, `npm install` had no peer errors and no `force`. Packages whose peers are an open `>=` range (`ngx-quill` 17.0.0, `@ngx-translate/core` 14, `@swimlane/ngx-datatable` 20.1.0, `@auth0/auth0-angular` 2.2.3) did not need a bump.

`@ngbracket/ngx-layout` and `ng2-charts` are not carried by `ng update`. They moved to **16.1.3** and **5.0.4** in the same hop. `ng2-charts` 5.0.0 through 5.0.2 published a schematics peer that does not resolve; **5.0.4** installs cleanly and still allows RxJS 6. The layout fork's RxJS 7 range is `^7.8.0`, which is narrower than Angular's `^7.4.0`. RxJS 6.6.7 satisfies the fork's `^6.5.3` side.

### Angular 16 removes `ngcc`, so the chart moved first

`ng2-charts` 2.4.3 is View Engine. It was replaced while the site was still on Angular 15, with `ng2-charts` 4.1.1 and Chart.js 4, then bumped to `ng2-charts` 5.0.4 with Angular. The live chart is the judge range report. Chart.js 3+ uses `x` / `y` scales, `title.text`, and `grid`, and the canvas input is `[type]`. The dashboard chart is still inside an HTML comment and still uses the old `[chartType]` inputs. Uncommenting it needs the same options shape.

### The guard schematic removes `implements`, not the methods

The core migration removed deprecated guard and resolver `implements` clauses from 31 files. `canActivate` and `resolve` stayed. Nothing in the app used `ReflectiveInjector`, `BrowserTransferStateModule`, `ComponentFactoryResolver`, or `router.navigate([], { relativeTo })`. `entryComponents` is still set on `AppLoaderModule`. The production build accepts it.

### This schematic did not rewrite `tsconfig` target

The Angular 15 schematic had set `target` to `ES2022`. That edit was reverted, and the checked-in target is still `es2020`. The Angular 16 schematic left it there. The CLI still applies ES2022 at build time and still warns. Browserslist entries that need ES5 (`kaios 2.5`, `op_mini all`) are still ignored.

### This machine's default Node is still outside the Angular range

Angular 16.2 supports Node `^16.14.0 || ^18.10.0`. Update and `ng build` used Node **16.20.2**, so the lockfile stayed `lockfileVersion` 2. The Angular 16 CLI does not run on Node 24. The Static Web Apps CLI on this machine requires Node 18 or newer, so the local proxy on port 44200 ran on Node 24 while `ng serve` used Node 16. CI and the website Docker image stay on Node 16. The global CLI pin in the website Dockerfile is `@angular/cli@16`.

### The next hop is already constrained by what this one left in place

Checked against the compatibility table for Angular 17, not copied from the 14 to 15 list.

- Angular 17 requires Node `^18.13.0 || ^20.9.0`. Node 16 remains valid for this website on Angular 16. CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image are Node 16. Installing on Node 18 can rewrite the lockfile npm major. Read the npm version that ships with the Node you choose before changing it.
- Angular 17.0 needs TypeScript `>=5.2.0`. This site is on **5.1.6**, which is inside the Angular 16.2 range (`>=4.9.3 <5.2`). Let `ng update` move it.
- Angular 17 still allows RxJS `^6.5.3 || ^7.4.0`. RxJS stays at **6.6.7** unless a package we bump refuses it. `ngx-quill` **17.0.0** is the release that still allows RxJS 6. Later `ngx-quill` releases require RxJS 7.
- `@ngbracket/ngx-layout`, `ng2-charts`, `ng2-file-upload`, and `ngx-cookie-service` must move with the Angular major. They are not carried by `ng update`. Confirm the peer range of the release you take. `ng2-charts` 5.0.0–5.0.2 did not install cleanly.
- The Material theme is still `define-light-theme($primary, $accent)`. The production build still warns that it is not a color, typography, and density map.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- Standalone components and typed forms were not adopted. `ng generate @angular/core:standalone` ships with Angular 16 and was not run.
- `entryComponents` remains on `AppLoaderModule`.
- The commented dashboard chart still uses the Chart.js 2 inputs.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`, `protractor` (`dertinfo-e2e`). TSLint-to-ESLint and dropping Protractor are separate work.

## Watch-list from the Angular 16 to 17 upgrade

These showed up on this website during the move to Angular 17.3. The update guide does not list them as application steps. Check them again on later hops. The full record, including package versions, is [Website upgraded from Angular 16 to Angular 17](../../operations/changelogs/2026-10-04-004-web-angular-17.md).

### Read the compatibility table before treating a leftover as a requirement

The 15 to 16 notes said `@ngbracket/ngx-layout`, `ng2-charts`, `ng2-file-upload`, and `ngx-cookie-service` must move with the Angular major. Checked on this hop, only the peers that name Angular 16 (`^16`) stopped `npm install`: `ng2-file-upload` **5.0.0** and `ngx-cookie-service` **16.1.0**. `@ngbracket/ngx-layout` **16.1.3** and `ng2-charts` **5.0.4** peer `>=16`. Both installed, and the production build accepted them on Angular 17.3.12. Do not bump an open `>=` range because a newer major exists.

### Node 16 cannot run the Angular 17 CLI

Angular 17.3 supports Node `^18.13.0 || ^20.9.0`. The website moved to Node 18 before `ng update`, while still on Angular 16.2, because 16.2 still allows `^18.10.0`. Website CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image are Node 18. npm **10.8.2** on Node **18.20.8** kept an existing `lockfileVersion` 2 until `npm install --lockfile-version 3`. The lockfile is now version 3. This machine's default Node is 24. Update and `ng build` used a portable Node **18.20.8**. nvm-windows is not installed. The Static Web Apps CLI on this machine is still the Node 24 global, and `ng serve` used Node 18. The Dockerfile's global CLI pin is `@angular/cli@17`. The Ionic app and its CI stay on Node 16.

### `ng update` can succeed while the next install still fails

`ng update @angular/cli@17 @angular/core@17` and `ng update @angular/material@17` completed with no `--force`. A later `npm install` failed because `ng2-file-upload` 5 peers `@angular/common` `^16`. That moved to **6.0.0**. `ngx-cookie-service` 16 peers `^16`, so it moved to **17.1.0** in the same install. After that, `npm install` had no peer errors and no `force`. Packages whose peers are an open `>=` range stayed: `@ngbracket/ngx-layout` 16.1.3, `ng2-charts` 5.0.4, `ngx-quill` 17.0.0, `@ngx-translate/core` 14, `@swimlane/ngx-datatable` 20.1.0, `@auth0/auth0-angular` 2.2.3. RxJS stayed at **6.6.7**. The layout fork's RxJS 7 peer is still `^7.8.0`.

### zone.js 0.14 removes the dist test imports

`src/test.ts` imported `zone.js/dist/*`. Those paths became `import 'zone.js/testing'` while zone was still 0.13. `ng update` then moved `zone.js` to **0.14.10**. `src/polyfills.ts` already imported `zone.js`. The Karma bootstrap, the Jasmine specs, and Protractor were removed after that. `src/test.ts` is gone.

### The core migration escapes `@` in templates

Angular 17 treats `@` as control flow. The core migration rewrote `@` to `&#64;` in five templates: the home and terms email addresses, the Dert of Derts how-to-enter email, and the two invoice lines that print a price with `@`. The visible text is unchanged. The new control flow syntax was not adopted.

### Material 17 does not publish the old theming import

`@import '@angular/material/theming'` failed the production build. The package export points at a root `_theming.scss` that is not in the published tarball. The themes already use `@use '@angular/material' as mat`, so that import was removed from the five theme files. `mat.define-light-theme($primary, $accent)` still builds and still warns that the theme is not a color, typography, and density map.

### The CLI renamed `browserTarget` and left the TypeScript target

`browserTarget` became `buildTarget` in `angular.json`. The webpack `browser` builder stayed. `tsconfig.json` `target` is still `es2020`. The CLI still applies ES2022 and still warns. Browserslist entries that need ES5 (`kaios 2.5`, `op_mini all`) are still ignored. Protractor, Karma, and Jasmine were removed from the website. The Playwright suite in `tests/e2e` is the test. The Ionic app still has Protractor and Karma.

### The next hop is already constrained by what this one left in place

Checked against the compatibility table for Angular 18, not copied from the 15 to 16 list.

- Angular 18.0 supports Node `^18.19.1 || ^20.11.1 || ^22.0.0`, TypeScript `>=5.4.0 <5.5.0`, and RxJS `^6.5.3 || ^7.4.0`. This site is on Node 18, TypeScript **5.4.5**, and RxJS **6.6.7**. Those three are inside the Angular 18.0 range. Let `ng update` move TypeScript if a later 18 patch narrows it. Angular 19.0 needs TypeScript `>=5.5.0`. Angular 20 drops Node 18 (`^20.19.0 || ^22.12.0 || ^24.0.0`). Node 24 still cannot run the Angular 17 CLI.
- `ngx-cookie-service` **17.1.0** and `ng2-file-upload` **6.0.0** peer `^17`. They have to move with Angular 18. `ng update` does not carry them.
- `@ngbracket/ngx-layout` 16.1.3 and `ng2-charts` 5.0.4 peer `>=16`. They installed on Angular 17. Confirm them again on 18 before bumping. `@ngbracket/ngx-layout` 18.0.0 exists, and ng2-charts publishes later majors, if the build refuses the current ones.
- RxJS stays at **6.6.7** unless a package we bump refuses it. A newer `ngx-quill` is what would force RxJS 7. `@ngbracket/ngx-layout` 16.1.3's RxJS 7 peer starts at 7.8.
- The Material theme is still `define-light-theme($primary, $accent)`. The production build still warns about it. `entryComponents` remains on `AppLoaderModule`. The commented dashboard chart still uses the Chart.js 2 inputs.
- The application builder, control flow, standalone components, and typed forms were not adopted.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`. TSLint-to-ESLint is separate work.

## Watch-list from the Angular 17 to 18 upgrade

These showed up on this website during the move to Angular 18.2. The update guide does not list them as application steps. Check them again on later hops. The full record, including package versions, is [Website upgraded from Angular 17 to Angular 18](../../operations/changelogs/2026-10-04-005-web-angular-18.md).

### Read the compatibility table before treating a leftover as a requirement

The 16 to 17 notes said `ngx-cookie-service` **17.1.0** and `ng2-file-upload` **6.0.0** must move because they peer `^17`. They did. `@ngbracket/ngx-layout` **16.1.3** and `ng2-charts` **5.0.4** still peer `>=16`. Both installed, and the production build accepted them on Angular 18.2.14. Do not bump an open `>=` range because a newer major exists. `@ngbracket/ngx-layout` publishes through Angular 22.

### Node, TypeScript, and RxJS were already inside the Angular 18.2 range

Angular 18.2 supports Node `^18.19.1 || ^20.11.1 || ^22.0.0`, TypeScript `>=5.4.0 <5.6.0`, and RxJS `^6.5.3 || ^7.4.0`. This site stayed on Node 18, TypeScript **5.4.5**, and RxJS **6.6.7**. `zone.js` stayed at **0.14.10**. There was no engine change before `ng update`. This machine's default Node is 24. Update and `ng build` used a portable Node **18.20.8**. nvm-windows is not installed. The Static Web Apps CLI on this machine is still the Node 24 global, and `ng serve` used Node 18. CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image stay on Node 18. The Dockerfile's global CLI pin is `@angular/cli@18`. The Ionic app and its CI stay on Node 16.

### `ng update` lists the application builder and does not run it unless asked

`ng update @angular/cli@18 @angular/core@18` and `ng update @angular/material@18` completed with no `--force`. The CLI printed one optional migration, `use-application-builder`, and did not run it. The webpack `browser` builder stayed. A non-interactive update skips that optional migration. Running it is a separate change.

### The core migration replaced `HttpClientModule`

The core migration removed `HttpClientModule` from `AppModule` and added `provideHttpClient(withInterceptorsFromDi())`, so the existing `HTTP_INTERCEPTORS` registration still applies. That migration is not optional. The new control flow, standalone components, typed forms, and zoneless change detection were not adopted.

### Material 18 renames the Material 2 Sass helpers

`ng update @angular/material@18` rewrote the five theme files. `define-palette` became `m2-define-palette`, `define-light-theme` became `m2-define-light-theme`, and `define-dark-theme` became `m2-define-dark-theme`. `mat.core()` and `mat.all-component-themes()` stayed. The custom palettes stayed. The production build still warns that the theme is not a color, typography, and density map. Material 3 was not adopted.

### This schematic did not rewrite `tsconfig` target

`tsconfig.json` `target` is still `es2020`. The CLI still applies ES2022 and still warns. Browserslist entries that need ES5 (`kaios 2.5`, `op_mini all`) are still ignored. `entryComponents` remains on `AppLoaderModule`. The build accepts it.

### Packages that peer `^17` move in the same hop

`ng update` does not carry them. `ngx-cookie-service` moved from 17.1.0 to **18.0.0**. `ng2-file-upload` moved from 6.0.0 to **7.0.1**. Version **7.0.0** also peers `jest-preset-angular`, which does not resolve. After that, `npm install` had no peer errors and no `force`. Packages whose peers are an open `>=` range stayed: `@ngbracket/ngx-layout` 16.1.3, `ng2-charts` 5.0.4, `ngx-quill` 17.0.0, `@ngx-translate/core` 14, `@swimlane/ngx-datatable` 20.1.0, `@auth0/auth0-angular` 2.2.3. RxJS stayed at **6.6.7**.

### The next hop is already constrained by what this one left in place

Checked against the compatibility table for Angular 19, not copied from the 16 to 17 list.

- Angular 19.0 supports Node `^18.19.1 || ^20.11.1 || ^22.0.0`, TypeScript `>=5.5.0 <5.7.0`, and RxJS `^6.5.3 || ^7.4.0`. This site is on Node 18 and RxJS **6.6.7**, which are inside that range. TypeScript **5.4.5** is not. Let `ng update` move it. Angular 19.2 allows TypeScript `>=5.5.0 <5.9.0`. Angular 20 drops Node 18 (`^20.19.0 || ^22.12.0 || ^24.0.0`). Node 24 still cannot run the Angular 18 CLI.
- `ngx-cookie-service` **18.0.0** and `ng2-file-upload` **7.0.1** peer `^18`. They have to move with Angular 19. `ng2-file-upload` **8** peers `^19`. `ng update` does not carry them.
- `@ngbracket/ngx-layout` 16.1.3 and `ng2-charts` 5.0.4 peer `>=16`. They installed on Angular 18. Confirm them again on 19 before bumping.
- RxJS stays at **6.6.7** unless a package we bump refuses it. A newer `ngx-quill` is what would force RxJS 7.
- The webpack `browser` builder is still supported and deprecated. `ng update` to 18 asks to migrate to the application builder. That migration was not run. The new control flow was not adopted. Angular 20 deprecates `*ngIf`, `*ngFor`, and `*ngSwitch`, and that hop runs the control-flow migration.
- The Material theme is still the Material 2 helpers, now under the `m2-` names. The production build still warns that it is not a color, typography, and density map. `entryComponents` remains on `AppLoaderModule`. The commented dashboard chart still uses the Chart.js 2 inputs.
- Standalone components, typed forms, and zoneless change detection were not adopted.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`. TSLint-to-ESLint is separate work.

## Watch-list from the Angular 18 to 19 upgrade

These showed up on this website during the move to Angular 19.2. The update guide does not list them as application steps. Check them again on later hops. The full record, including package versions, is [Website upgraded from Angular 18 to Angular 19](../../operations/changelogs/2026-10-04-006-web-angular-19.md).

### Read the compatibility table before treating a leftover as a requirement

The 17 to 18 notes said `ngx-cookie-service` **18.0.0** and `ng2-file-upload` **7.0.1** must move because they peer `^18`. They did. `@ngbracket/ngx-layout` **16.1.3** and `ng2-charts` **5.0.4** still peer `>=16`. Both installed, and the production build accepted them on Angular 19.2.25. Do not bump an open `>=` range because a newer major exists.

### TypeScript and zone.js moved; Node and RxJS did not

Angular 19.2 supports Node `^18.19.1 || ^20.11.1 || ^22.0.0`, TypeScript `>=5.5.0 <5.9.0`, and RxJS `^6.5.3 || ^7.4.0`. The installed CLI 19.2.27 engines field is `^18.19.1 || ^20.11.1 || >=22.0.0`. This site stayed on Node 18 and RxJS **6.6.7**. `ng update` moved TypeScript from **5.4.5** to **5.8.3** and `zone.js` from **0.14.10** to **0.15.1**. There was no engine change before `ng update`. This machine's default Node is 24. Update, install, `ng build`, and `ng serve` used a portable Node **18.20.8**. nvm-windows is not installed. The Static Web Apps CLI on this machine is still the Node 24 global, and `ng serve` used Node 18. CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image stay on Node 18. The Dockerfile's global CLI pin is `@angular/cli@19`. The Ionic app and its CI stay on Node 16.

### `ng update` lists optional migrations and does not run them unless asked

`ng update @angular/cli@19 @angular/core@19` and `ng update @angular/material@19` completed with no `--force`. The CLI listed `use-application-builder` and `provide-initializer` as optional and did not run them. The webpack `browser` builder stayed. `APP_INITIALIZER` stayed. A non-interactive update skips those optional migrations.

### The core migration sets `standalone: false`

Angular 19 defaults `standalone` to true. The required `explicit-standalone-flag` migration added `standalone: false` to the NgModule components, directives, and pipes (225 files) and would remove `standalone: true` where it was already set. That keeps the current NgModule behaviour. It is not a conversion to standalone. `ng generate @angular/core:standalone` was not run.

### Material 19 splits `mat.core()`

`ng update @angular/material@19` replaced `@include mat.core()` with `@include mat.elevation-classes()` and `@include mat.app-background()` in the five theme files. The `m2-` palette and theme helpers stayed. The production build still warns that the theme is not a color, typography, and density map. Material 3 was not adopted.

### Inactive stepper steps are inert

Material 19 marks an unselected step's content `inert` and `visibility: hidden`. The step header is selected before that body is visible. A `fill` with `force: true` on a control that is not yet visible does not update the form. The smoke helpers wait until the control is visible, then fill. The event configure flow failed until that wait was in place.

### Packages that peer `^18` move in the same hop

`ng update` does not carry them. `ngx-cookie-service` moved from 18.0.0 to **19.1.2**. `ng2-file-upload` moved from 7.0.1 to **8.0.0**. Version 8.0.0 peers `@angular/core` `^19` and does not peer `jest-preset-angular`. After that, `npm install` had no peer errors and no `force`. Packages whose peers are an open `>=` range stayed: `@ngbracket/ngx-layout` 16.1.3, `ng2-charts` 5.0.4, `ngx-quill` 17.0.0, `@ngx-translate/core` 14, `@swimlane/ngx-datatable` 20.1.0, `@auth0/auth0-angular` 2.2.3. RxJS stayed at **6.6.7**.

### The next hop is already constrained by what this one left in place

Checked against the compatibility table for Angular 20, not copied from the 17 to 18 list.

- Angular 20.0 supports Node `^20.19.0 || ^22.12.0 || ^24.0.0`, TypeScript `>=5.8.0 <5.9.0`, and RxJS `^6.5.3 || ^7.4.0`. Angular 20.2 allows TypeScript `>=5.8.0 <6.0.0`. This site is on TypeScript **5.8.3** and RxJS **6.6.7**, which are inside the Angular 20.0 range. Node 18 is not. CI, the website image, and this hop's portable Node are 18. The next hop has to move those off Node 18 before `ng update`.
- `ngx-cookie-service` **19.1.2** and `ng2-file-upload` **8.0.0** peer `^19`. They have to move with Angular 20. `ng update` does not carry them.
- `@ngbracket/ngx-layout` 16.1.3 and `ng2-charts` 5.0.4 peer `>=16`. They installed on Angular 19. Confirm them again on 20 before bumping.
- RxJS stays at **6.6.7** unless a package we bump refuses it.
- The webpack `browser` builder is still supported and deprecated. The application builder was not adopted. `APP_INITIALIZER` was not replaced. Angular 20 deprecates `*ngIf`, `*ngFor`, and `*ngSwitch`, and that hop runs the control-flow migration.
- The Material theme is still the Material 2 helpers under the `m2-` names, with `mat.elevation-classes()` and `mat.app-background()` in place of `mat.core()`. The production build still warns that it is not a color, typography, and density map. `entryComponents` remains on `AppLoaderModule`. The commented dashboard chart still uses the Chart.js 2 inputs.
- Standalone components were not adopted. The `standalone: false` flags are what keep the NgModules working. Typed forms and zoneless change detection were not adopted. Angular 20 makes `zone.js` optional. This site stays on `zone.js` **0.15.1**.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`. TSLint-to-ESLint is separate work.

## Watch-list from the Angular 19 to 20 upgrade

These showed up on this website during the move to Angular 20.3. The update guide does not list them as application steps. Check them again on later hops. The full record, including package versions, is [Website upgraded from Angular 19 to Angular 20](../../operations/changelogs/2026-10-04-007-web-angular-20.md).

### Read the compatibility table before treating a leftover as a requirement

The 18 to 19 notes said `ngx-cookie-service` **19.1.2** and `ng2-file-upload` **8.0.0** must move because they peer `^19`. They did. `@ngbracket/ngx-layout` **16.1.3** and `ng2-charts` **5.0.4** still peer `>=16`. Both installed, and the production build accepted them on Angular 20.3.33. Do not bump an open `>=` range because a newer major exists.

### Node 18 cannot run the Angular 20 CLI

Angular 20.3 supports Node `^20.19.0 || ^22.12.0 || ^24.0.0`. The installed CLI 20.3.37 engines field is `^20.19.0 || ^22.12.0 || >=24.0.0`. The website moved to Node 20 before `ng update`, while still on Angular 19.2, because 19.2 still allows `^20.11.1`. Website CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image are Node 20. npm **10.8.2** on Node **20.20.2** kept `lockfileVersion` 3. This machine's default Node is 24. Update, install, `ng build`, and `ng serve` used a portable Node **20.20.2**. nvm-windows is not installed. The Static Web Apps proxy already on port 44200 stayed on Node 18.20.8. The Dockerfile's global CLI pin is `@angular/cli@20`. The Ionic app and its CI stay on Node 16. Node 20 ended on 30 April 2026. **20.20.2** is the last release on that line. Angular 21 still lists `^20.19.0`.

### The control-flow migration is optional

`ng update @angular/cli@20 @angular/core@20` and `ng update @angular/material@20` completed with no `--force`. The CLI listed `use-application-builder`, `control-flow-migration`, and `router-current-navigation` as optional and did not run them. The webpack `browser` builder stayed. `*ngIf`, `*ngFor`, and `*ngSwitch` stayed. They are deprecated and the production build accepts them. `APP_INITIALIZER` stayed. `provide-initializer` was not offered. A non-interactive update skips those optional migrations.

### `moduleResolution` became `bundler`, and `DOCUMENT` moved

The CLI migration set `tsconfig.json` `moduleResolution` from `node` to `bundler`. `target` stayed `es2020`. The CLI still applies ES2022 and still warns. The same migration added schematic `type` and `typeSeparator` defaults so generated files keep the previous suffixes. The core migration moved the `DOCUMENT` import in `auth.service.ts` from `@angular/common` to `@angular/core`. The Material migration made no source changes.

### Packages that peer `^19` move in the same hop

`ng update` does not carry them. A later `npm install` failed because `ng2-file-upload` 8 peers `@angular/common` `^19`. That moved to **9.0.0**. `ngx-cookie-service` 19 peers `^19`. Version **20.0.0** still peers `^19`, so the install took **20.1.1**. After that, `npm install` had no peer errors and no `force`. Packages whose peers are an open `>=` range stayed: `@ngbracket/ngx-layout` 16.1.3, `ng2-charts` 5.0.4, `ngx-quill` 17.0.0, `@ngx-translate/core` 14, `@swimlane/ngx-datatable` 20.1.0, `@auth0/auth0-angular` 2.2.3. RxJS stayed at **6.6.7**. TypeScript stayed at **5.8.3**. `zone.js` stayed at **0.15.1**.

### Angular 20 warns about Browserslist entries the previous CLI only ignored for ES5

The production build still ignores `kaios 2.5` and `op_mini all`. It also warns that `and_qq 14.9`, `and_uc 15.5`, `android 154`, `kaios 3.0-3.1`, `op_mob 80`, `opera 135`, `opera 134`, `samsung 30`, and `samsung 29` fall outside Angular 20's browser support. `.browserslistrc` was left as it was. The theme warning is unchanged.

### The next hop is already constrained by what this one left in place

Checked against the compatibility table for Angular 21, not copied from the 18 to 19 list.

- Angular 21.0–21.2 supports Node `^20.19.0 || ^22.12.0 || ^24.0.0`, TypeScript `>=5.9.0 <6.0.0`, and RxJS `^6.5.3 || ^7.4.0`. This site is on Node 20 and RxJS **6.6.7**, which are inside that range. TypeScript **5.8.3** is not. Let `ng update` move it. Angular 22 drops Node 20 (`^22.22.3 || ^24.15.0 || ^26.0.0`) and needs TypeScript `>=6.0.0 <6.1.0`.
- `ngx-cookie-service` **20.1.1** and `ng2-file-upload` **9.0.0** peer `^20`. They have to move with Angular 21. Cookie-service 21 and `ng2-file-upload` 10 peer Angular 21. `ng update` does not carry them.
- `@ngbracket/ngx-layout` 16.1.3 and `ng2-charts` 5.0.4 peer `>=16`. They installed on Angular 20. Confirm them again on 21 before bumping.
- RxJS stays at **6.6.7** unless a package we bump refuses it.
- The webpack `browser` builder is still supported and deprecated. The application builder was not adopted. `APP_INITIALIZER` was not replaced. The control-flow migration was not run.
- The Material theme is still the Material 2 helpers under the `m2-` names, with `mat.elevation-classes()` and `mat.app-background()`. The production build still warns that it is not a color, typography, and density map, and that some Browserslist entries are outside the Angular 20 browser set. `entryComponents` remains on `AppLoaderModule`. The commented dashboard chart still uses the Chart.js 2 inputs.
- Standalone components were not adopted. The `standalone: false` flags are what keep the NgModules working. Typed forms and zoneless change detection were not adopted. This site stays on `zone.js` **0.15.1**. `moduleResolution` is `bundler`.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`. TSLint-to-ESLint is separate work.

## Watch-list from the Angular 20 to 21 upgrade

These showed up on this website during the move to Angular 21.2. The update guide does not list them as application steps. Check them again on later hops. The full record, including package versions, is [Website upgraded from Angular 20 to Angular 21](../../operations/changelogs/2026-10-05-001-web-angular-21.md).

### Read the compatibility table before treating a leftover as a requirement

The 19 to 20 notes said `ngx-cookie-service` **20.1.1** and `ng2-file-upload` **9.0.0** must move because they peer `^20`. They did. `@ngbracket/ngx-layout` **16.1.3** and `ng2-charts` **5.0.4** still peer `>=16`. Both installed, and the production build accepted them on Angular 21.2.25. Do not bump an open `>=` range because a newer major exists.

### Node and RxJS were already inside the Angular 21 range

Angular 21.2 supports Node `^20.19.0 || ^22.12.0 || ^24.0.0`, TypeScript `>=5.9.0 <6.0.0`, and RxJS `^6.5.3 || ^7.4.0`. The installed CLI 21.2.24 engines field is `^20.19.0 || ^22.12.0 || >=24.0.0`. This site stayed on Node 20 and RxJS **6.6.7**. `ng update` moved TypeScript from **5.8.3** to **5.9.3**. `zone.js` stayed at **0.15.1**. There was no engine change before `ng update`. This machine's default Node is 24. Update, install, `ng build`, and `ng serve` used a portable Node **20.20.2**. nvm-windows is not installed. The Static Web Apps proxy already on port 44200 stayed up. CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image stay on Node 20. The Dockerfile's global CLI pin is `@angular/cli@21`. The Ionic app and its CI stay on Node 16. Node 20 ended on 30 April 2026. Angular 22 drops it.

### The control-flow migration runs, and this hop put the templates back

`ng update @angular/cli@21 @angular/core@21` and `ng update @angular/material@21` completed with no `--force`. The control-flow migration is no longer in the optional list. It rewrote 111 templates from `*ngIf`, `*ngFor`, and `*ngSwitch` to the block syntax. Those template edits were restored. The structural directives stay. The production build accepts them. `use-application-builder` and `router-current-navigation` stayed optional and were not run. The webpack `browser` builder stayed. `APP_INITIALIZER` stayed.

### `provideZoneChangeDetection` is what keeps Zone change detection

Angular 21 does not schedule Zone change detection unless the app provides it. The bootstrap migration added `provideZoneChangeDetection()` as `applicationProviders` on `bootstrapModule` in `main.ts`. The `zone.js` import in `src/polyfills.ts` stayed. Zoneless change detection was not adopted.

### The TypeScript lib migration removes the old `lib` array

`tsconfig.json` `lib` was `es2016` and `dom`. The migration removes that array when it contains DOM and an ES version of 2022 or older. `target` stayed `es2020`. The CLI still applies ES2022 and still warns. `moduleResolution` stayed `bundler`.

### A host listener that passes an unused event no longer compiles

Angular 21 checks `@HostListener` arguments against the method. `scroll-to.directive.ts` passed `$event` into `smoothScroll()`, which takes no arguments. The unused argument was removed. Listeners whose methods already take the event were left.

### Material 21 marks the selected step with `aria-current`

The selected `mat-step-header` has `aria-current="step"`. `aria-selected` and `aria-posinset` are gone. The header id ends `-label-N`. The smoke helpers wait on `aria-current="step"` and that id. Inactive step content is still hidden until the header is current.

### Packages that peer `^20` move in the same hop

`ng update` does not carry them. A later `npm install` failed because `ng2-file-upload` 9 peers `@angular/common` `^20`. That moved to **10.0.0**, whose peer is `@angular/core` and `@angular/common` `^21.x.x`. That range installed against 21.2.25, and 10.0.0 does not peer `jest-preset-angular`. `ngx-cookie-service` 20 peers `^20`. Version **21.3.1** peers `^21.0.0`. Version **22.0.0** peers `^22`. After that, `npm install` had no peer errors and no `force`. Packages whose peers are an open `>=` range stayed: `@ngbracket/ngx-layout` 16.1.3, `ng2-charts` 5.0.4, `ngx-quill` 17.0.0, `@ngx-translate/core` 14, `@swimlane/ngx-datatable` 20.1.0, `@auth0/auth0-angular` 2.2.3. RxJS stayed at **6.6.7**.

### Angular 21 warns about one more Browserslist entry

The production build still ignores `kaios 2.5` and `op_mini all`. It also warns that `and_qq 14.9`, `and_uc 15.5`, `android 154`, `chrome 109`, `kaios 3.0-3.1`, `op_mob 80`, `opera 135`, `opera 134`, `samsung 30`, and `samsung 29` fall outside Angular 21's browser support. `chrome 109` is new on this hop. `.browserslistrc` was left as it was. The theme warning is unchanged.

### The next hop is already constrained by what this one left in place

Checked against the compatibility table for Angular 22, not copied from the 19 to 20 list.

- Angular 22.0 supports Node `^22.22.3 || ^24.15.0 || ^26.0.0`, TypeScript `>=6.0.0 <6.1.0`, and RxJS `^6.5.3 || ^7.4.0`. This site is on Node 20, TypeScript **5.9.3**, and RxJS **6.6.7**. Node 20 and TypeScript 5.9 are outside that range. RxJS is inside it. The next hop has to move Node before `ng update`. Let `ng update` move TypeScript. Do not take a TypeScript version outside `>=6.0.0 <6.1.0`.
- `ngx-cookie-service` **21.3.1** peers `^21`. It has to move with Angular 22. Version **22.0.0** peers `^22`. `ng2-file-upload` **10.0.0** peers `^21`. No later major was published on this hop. `ng update` does not carry either package.
- `@ngbracket/ngx-layout` 16.1.3 and `ng2-charts` 5.0.4 peer `>=16`. They installed on Angular 21. Confirm them again on 22 before bumping.
- RxJS stays at **6.6.7** unless a package we bump refuses it.
- The webpack `browser` builder is still supported and deprecated. The application builder was not adopted. `APP_INITIALIZER` was not replaced. The control-flow migration ran and the template edits were restored, so `*ngIf`, `*ngFor`, and `*ngSwitch` stay.
- The Material theme is still the Material 2 helpers under the `m2-` names, with `mat.elevation-classes()` and `mat.app-background()`. The production build still warns that it is not a color, typography, and density map, and that some Browserslist entries are outside the Angular 21 browser set. `entryComponents` remains on `AppLoaderModule`. The commented dashboard chart still uses the Chart.js 2 inputs.
- Standalone components were not adopted. The `standalone: false` flags are what keep the NgModules working. Typed forms and zoneless change detection were not adopted. This site stays on `zone.js` **0.15.1**, with `provideZoneChangeDetection()` on `bootstrapModule`. `moduleResolution` is `bundler`. `tsconfig.json` has no `lib` array.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`. TSLint-to-ESLint is separate work.

## Watch-list from the Angular 21 to 22 upgrade

These showed up on this website during the move to Angular 22.2. The update guide does not list them as application steps. Check them again on a later hop. The full record, including package versions, is [Website upgraded from Angular 21 to Angular 22](../../operations/changelogs/2026-10-05-002-web-angular-22.md).

### Read the compatibility table before treating a leftover as a requirement

The 20 to 21 notes said `ngx-cookie-service` **21.3.1** must move because it peers `^21`, and that `ng2-file-upload` **10.0.0** had no later major. Cookie-service moved to **22.0.0**. File-upload **11.0.0** was published by the time of this hop and peers `^22.x.x`, so it moved too. `@ngbracket/ngx-layout` **16.1.3** and `ng2-charts` **5.0.4** still peer `>=16`. Both installed, and the production build accepted them on Angular 22.2.1. Do not bump an open `>=` range because a newer major exists.

### Node 20 cannot run the Angular 22 CLI

Angular 22.2 supports Node `^22.22.3 || ^24.15.0 || ^26.0.0`. The installed CLI 22.2.1 engines field is `^22.22.3 || ^24.15.0 || >=26.0.0`. The website moved to Node 22 before `ng update`, while still on Angular 21.2, because 21.2 still allows `^22.12.0`. Node **22.22.2** is below the Angular 22 floor. Portable Node **22.23.3** (npm 10.9.9) is inside both ranges. Website CI (`web-src-ci.yml`, `web-src-cd.yml`) and the website image are Node 22. A plain `npm install` on that Node, before `ng update`, kept `lockfileVersion` 3. This machine's default Node is 24.19.0, which is inside the Angular 22 CLI range (`>=24.15.0`). Update, install, `ng build`, and `ng serve` used the portable Node 22 so the lockfile stayed on npm 10. nvm-windows is not installed. The Static Web Apps proxy already on port 44200 stayed up. The Dockerfile's global CLI pin is `@angular/cli@22`. The Ionic app and its CI stay on Node 16.

### `ng update` refused to start until `--force`

`ng update @angular/cli@22 @angular/core@22` stopped on the peer check for `ng2-file-upload` 10, `ngx-cookie-service` 21, and `codelyzer`. `--force` was used only to get the schematic through. `ng update @angular/material@22` needed `--allow-dirty` and the same `--force`. After cookie-service **22.0.0** and file-upload **11.0.0**, a later `npm install` had no peer errors and no `force`. No `.npmrc` was added. `codelyzer` still peers Angular below 13 and stayed. The clean install did not fail on it.

### Optional migrations were not run, and the control-flow migration was not offered

The CLI listed `use-application-builder` and `migrate-karma-to-vitest` as optional and did not run them. The webpack `browser` builder stayed. The production build now prints that this builder is deprecated with Angular's Webpack support. `*ngIf`, `*ngFor`, and `*ngSwitch` stayed. The control-flow migration was not in the list, so there was nothing to restore. `APP_INITIALIZER` stayed.

### Required migrations keep today's change detection, XHR, and optional chaining

Angular 22 defaults a component with no strategy to OnPush, and renames the old `Default` strategy to `Eager`. The migration added `changeDetection: ChangeDetectionStrategy.Eager` on 208 components. The component that already set `OnPush` was left. HttpClient defaults to Fetch. The migration added `withXhr()` beside `withInterceptorsFromDi()` in `app.module.ts`. Nine templates gained `$safeNavigationMigration(...)` around optional chaining, which keeps the old null result. Those wrappers stayed. `provideZoneChangeDetection()` stayed on `bootstrapModule`.

### Route params are inherited unless the router is told otherwise

`paramsInheritanceStrategy` now defaults to `'always'`. There is no migration. `RouterModule.forRoot` sets `paramsInheritanceStrategy: 'emptyOnly'`, which is the previous behaviour.

### TypeScript 6 turns strict checking and `esModuleInterop` on

`ng update` moved TypeScript from **5.9.3** to **6.0.3**, inside `>=6.0.0 <6.1.0`. TypeScript 6 defaults `strict` and `esModuleInterop` to true, and it errors on deprecated `baseUrl` and `downlevelIteration` unless `ignoreDeprecations` is `"6.0"`. `tsconfig.json` sets `strict: false`, `esModuleInterop: false`, and `ignoreDeprecations: "6.0"` so the previous checking and `import * as moment` stay. `target` stayed `es2020`. The CLI still applies ES2022 and still warns. A core migration wrote `strictTemplates: false` and an `extendedDiagnostics` suppress. Those two together fail the build (`NG4003`). The suppress was removed. `strictTemplates` stays false, which is the previous template checking.

### The next major is not released

Angular 22 is the current major. There is no compatibility row yet for a later major, so this hop does not copy an engine requirement forward. The modernisation those hops left for later is [issue 96](https://github.com/dertinfo/dertinfo-mono/issues/96).

- RxJS stays at **6.6.7**. `zone.js` stays at **0.15.1**. Node for the website is **22.23.3**.
- `@ngbracket/ngx-layout` 16.1.3 and `ng2-charts` 5.0.4 peer `>=16`. They installed on Angular 22. Confirm them again before treating a newer major as required.
- The webpack `browser` builder is deprecated. The application builder was not adopted. `APP_INITIALIZER` was not replaced. `*ngIf`, `*ngFor`, and `*ngSwitch` stay.
- The Material theme is still the Material 2 helpers under the `m2-` names, with `mat.elevation-classes()` and `mat.app-background()`. The production build still warns that it is not a color, typography, and density map, and that the same Browserslist entries as Angular 21 fall outside the browser set. `entryComponents` remains on `AppLoaderModule`. The commented dashboard chart still uses the Chart.js 2 inputs.
- Standalone components were not adopted. The `standalone: false` flags stay. Typed forms, signal forms, and zoneless change detection were not adopted. Change detection stays Eager, except the one OnPush component. HttpClient stays on XHR via `withXhr()`. `moduleResolution` is `bundler`. `tsconfig.json` has no `lib` array.
- Competition admin, Dert of Derts, notifications, and system admin were not part of the layout pass.
- These packages are still referenced and were left in place: `angular-csv-ext`, `hopscotch`, `perfect-scrollbar`, `moment`, `tslint`, `codelyzer`. TSLint-to-ESLint is separate work.

## Related

- [Angular standards](../standards/angular/README.md)
- [Configuration](../infra/configuration.md)
- [Website smoke tests](website-smoke-tests.md)
- [Deferred website Angular modernisation](https://github.com/dertinfo/dertinfo-mono/issues/96)
- [Website upgraded from Angular 14 to Angular 15](../../operations/changelogs/2026-10-04-002-web-angular-15.md)
- [Website upgraded from Angular 15 to Angular 16](../../operations/changelogs/2026-10-04-003-web-angular-16.md)
- [Website upgraded from Angular 16 to Angular 17](../../operations/changelogs/2026-10-04-004-web-angular-17.md)
- [Website upgraded from Angular 17 to Angular 18](../../operations/changelogs/2026-10-04-005-web-angular-18.md)
- [Website upgraded from Angular 18 to Angular 19](../../operations/changelogs/2026-10-04-006-web-angular-19.md)
- [Website upgraded from Angular 19 to Angular 20](../../operations/changelogs/2026-10-04-007-web-angular-20.md)
- [Website upgraded from Angular 20 to Angular 21](../../operations/changelogs/2026-10-05-001-web-angular-21.md)
- [Website upgraded from Angular 21 to Angular 22](../../operations/changelogs/2026-10-05-002-web-angular-22.md)
