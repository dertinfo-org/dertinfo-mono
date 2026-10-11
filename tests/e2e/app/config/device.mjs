/**
 * Screen used by the app tests.
 * Playwright's "iPhone SE" descriptor is the original SE, the same 320×568 panel as an iPhone 5.
 */
import { devices } from 'playwright';

const iphone5 = devices['iPhone SE'];

export function appContext(extra = {}) {
  return {
    viewport: iphone5.viewport,
    deviceScaleFactor: iphone5.deviceScaleFactor,
    isMobile: iphone5.isMobile,
    hasTouch: iphone5.hasTouch,
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    videoSize: { ...iphone5.viewport },
    ...extra,
  };
}
