import path from 'path';
import { fileURLToPath } from 'url';
import { runFixture } from '../../../shared-tools/run-fixture.mjs';

await runFixture({
  fixtureDir: path.dirname(fileURLToPath(import.meta.url)),
  featureId: 'invoicing.payment-status',
  testFiles: [
    'invoicing.event-admin.reviews.mjs',
    'invoicing.group-admin.reviews.mjs',
  ],
});
