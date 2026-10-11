import path from 'path';
import { fileURLToPath } from 'url';
import { runFixture } from '../../../shared-tools/run-fixture.mjs';

await runFixture({
  fixtureDir: path.dirname(fileURLToPath(import.meta.url)),
  featureId: 'registration.submit',
  testFiles: [
    'registration.groupadmin.registerforevent-scenario1.mjs',
    'registration.groupadmin.amends-submitted.mjs',
  ],
});
